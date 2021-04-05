import { Component, ViewChild, OnInit, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import WebViewer, { Annotations as AnnotationsType } from '@pdftron/webviewer';
import { Observable } from 'rxjs';

enum Colors {
  GREY = '#ededed',
  RED = '#c72a2a'
}

@Component({
  selector: 'app-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss']
})
export class DocumentComponent implements OnInit, AfterViewInit {
  @ViewChild('viewer', { static: false }) viewer: ElementRef;

  wvInstance: any;
  pendingComments = {};

  constructor() { }

  ngAfterViewInit(): void {

    WebViewer({
      path: '../lib',
      initialDoc: '../files/test_four_fields.pdf',
      css: 'app/webviewer.css',
      ui: 'default'
    }, this.viewer.nativeElement).then(instance => {
      this.wvInstance = instance;

      // now you can access APIs through this.webviewer.getInstance()
      instance.openElements(['notesPanel']);
      // see https://www.pdftron.com/documentation/web/guides/ui/apis for the full list of APIs

      // or listen to events from the viewer element
      this.viewer.nativeElement.addEventListener('pageChanged', (e) => {
        const [pageNumber] = e.detail;
        console.log(`Current page is ${pageNumber}`);
      });

      // or from the docViewer instance
      instance.docViewer.on('documentLoaded', this.wvDocumentLoadedHandler);
    });
  }

  ngOnInit() {
    this.wvDocumentLoadedHandler = this.wvDocumentLoadedHandler.bind(this);
  }

  canDeactivate(): Observable<boolean> | boolean {
    // Clean up webviewer
    return true;
  }

  wvDocumentLoadedHandler(): void {
    console.log('documentLoaded');
    const { annotManager, Annotations } = this.wvInstance;

    Annotations.WidgetAnnotation.getContainerCustomStyles = widget => {
      if (widget instanceof Annotations.TextWidgetAnnotation) {
        // can check widget properties
        if (widget.fieldFlags.get('Required')) {
          return {
            'background-color': Colors.GREY,
            'border': `solid 1px ${Colors.RED}`
          };
        }
        return {
          'background-color': Colors.GREY
        };
      }
    };

    const currentUserEmail = 'example@email.com';
    annotManager.setCurrentUser(currentUserEmail);

    annotManager.on('annotationChanged', (annotations, action, options) => {
      const annot = annotations[0];
      if (annot instanceof Annotations.StickyAnnotation && !options.imported) {
        if (action === 'add') {
          if (!annot.InReplyTo) {
            // Newly added comments are pending until the comment 'save' button is clicked.
            // When clicked, the 'modify' event is fired.
            this.pendingComments[annot.Id] = true;
          } else {
            // Is a reply
            this.exportDocumentComment(annot)
              .then(documentComment => {
                console.log(documentComment);
              });
          }
        } else if (action === 'modify') {
          if (this.pendingComments[annot.Id]) {
            // Is a pending comment
            this.exportDocumentComment(annot)
              .then(documentComment => {
                console.log(documentComment);
                this.pendingComments[annot.Id] = false;
              });

          } else {
            // Editing a comment
            this.exportDocumentComment(annot)
              .then(documentComment => {
                console.log(documentComment);
              });
          }
        } else if (action === 'delete') {
          // Deleting a comment
          console.log('deleted');
        }
      }
    });
  }

  exportDocumentComment(annot: AnnotationsType.StickyAnnotation): Promise<any> {
    const { annotManager } = this.wvInstance;
    return new Promise<any>(resolve => {
      annotManager.exportAnnotations({ annotList: [annot], links: false, widgets: false, fields: false }).then(xfdfString => {
        const data = {
          annotationId: annot.Id,
          parentAnnotationId: annot.InReplyTo,
          author: annot.Author,
          dateCreated: annot.DateCreated.toISOString(),
          dateModified: annot.DateModified.toISOString(),
          pageNumber: annot.PageNumber.toString(),
          xfdf: xfdfString
        };

        resolve(data);
      });
    });
  }

}
